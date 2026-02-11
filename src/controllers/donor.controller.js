import { DonorModel } from "../models/donor.model.js";

export const createDonor = async (req, res) => {
  try {
    const {
      full_name,
      cause,
      donation_amount,
      gender,
      mobile,
      email,
      image_url,
    } = req.body;

    if (!full_name || !cause || !donation_amount || !mobile || !email) {
      return res.status(400).json({
        message: "Required fields missing",
      });
    }

    const donor = await DonorModel.create({
      full_name,
      cause,
      donation_amount,
      gender,
      mobile,
      email,
      image_url,
    });

    res.status(201).json({
      message: "Donor created successfully",
      donor,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getAllDonors = async (req, res) => {
  try {
    const donors = await DonorModel.getAll();
    res.json(donors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDonorById = async (req, res) => {
  try {
    const donor = await DonorModel.getById(req.params.id);
    res.json(donor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateDonor = async (req, res) => {
  try {
    const donor = await DonorModel.update(req.params.id, req.body);
    res.json({
      message: "Donor updated successfully",
      donor,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteDonor = async (req, res) => {
  try {
    await DonorModel.delete(req.params.id);
    res.json({
      message: "Donor deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
